<%@ Page Title="" Language="VB" MasterPageFile="~/MasterPage.master" AutoEventWireup="false" CodeFile="Business_Tracking_Receipted.aspx.vb" Inherits="_Default" %>

<%@ OutputCache Location="None" %>
<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="cc1" %>
<%@ Register assembly="Telerik.Web.UI" namespace="Telerik.Web.UI" tagprefix="telerik" %>
<asp:Content ID="Content1" ContentPlaceHolderID="ContentPlaceHolder1" Runat="Server">
    <asp:UpdateProgress ID="UpdateProgress1" runat="server">
        <ProgressTemplate>
         <asp:Label ID="lblProgress" runat="server" Font-Bold="True" ForeColor="Red" 
                Text="Please Wait...." Font-Size="Medium"></asp:Label>
        </ProgressTemplate>
    </asp:UpdateProgress>
    <asp:UpdatePanel ID="UpdatePanel1" runat="server">
                <ContentTemplate>
                    <div align="center">
                    
                    <asp:Panel ID="Panel1" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                        Width="1176px">
                 
                 <table style="width: 96%; margin-left: 0px;" align="center">
                                <tr>
                                    <td class="style8">
                                      <asp:Panel ID="Panel8" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                            Height="100%" Width="1170px">
                            <table style="1100: ;">
                                <tr>
                                    <td align="center" bgcolor="#CCCCCC">
                                        <asp:Label ID="Label135" runat="server" Font-Bold="True" 
                                            Text="RECEIPTING" Font-Size="Medium"></asp:Label>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        <table style="width: 1132px">
                                            <tr>
                                                <td style="width: 1025px" align="right">
                                                    <asp:Label ID="Label141" runat="server" Text="Search by"></asp:Label>
                                                </td>
                                                <td style="width: 125px">
                                                    <telerik:RadComboBox ID="cbosearch" Runat="server" AllowCustomText="True" 
                                                        AutoPostBack="True" MarkFirstMatch="True" Skin="Web20" Width="190px">
                                                        <Items>
                                                            <telerik:RadComboBoxItem runat="server" Text="Proposer Name" Value="P" />
                                                            <telerik:RadComboBoxItem runat="server" Text="File No." Value="F" />
                                                        </Items>
                                                    </telerik:RadComboBox>
                                                </td>
                                                <td style="width: 264px">
                                                    <telerik:RadTextBox ID="txtsearch" Runat="server" Skin="Web20" Width="250px">
                                                    </telerik:RadTextBox>
                                                </td>
                                                <td>
                                                    <telerik:RadButton ID="btnsearch" runat="server" Text="Search" Skin="Simple">
                                                    </telerik:RadButton>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colspan="4">
                                                    <asp:Label ID="Label173" runat="server" Font-Bold="True" 
                                                        Text="Returned Policy Doc"></asp:Label>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colspan="4">
                                                    <asp:Panel ID="Panel32" runat="server" Height="100%" ScrollBars="Both" 
                                                        Width="1128px">
                                                        <telerik:RadGrid ID="GDTracking_R" runat="server" AllowPaging="True" 
                                                            CellSpacing="0" GridLines="None" Height="100%" PageSize="20" Skin="Web20" 
                                                            Width="100%">
                                                            <MasterTableView AutoGenerateColumns="False" DataKeyNames="File_No">
                                                                <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                    <HeaderStyle Width="20px" />
                                                                </RowIndicatorColumn>
                                                                <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                    <HeaderStyle Width="20px" />
                                                                </ExpandCollapseColumn>
                                                                <Columns>
                                                                    <telerik:GridBoundColumn DataField="Allocate_dt" 
                                                                        FilterControlAltText="Filter Allocate_dt column" HeaderText="Allocate_dt" 
                                                                        SortExpression="Allocate_dt" UniqueName="Allocate_dt">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="File_No" 
                                                                        FilterControlAltText="Filter File_No column" HeaderText="File_No" 
                                                                        SortExpression="File_No" UniqueName="File_No">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="eOx_Invoice_No" 
                                                                        FilterControlAltText="Filter eOx_Invoice_No column" HeaderText="Invoice_No" 
                                                                        SortExpression="eOx_Invoice_No" UniqueName="eOx_Invoice_No">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Proposer_Name" 
                                                                        FilterControlAltText="Filter Proposer_Name column" HeaderText="Proposer_Name" 
                                                                        SortExpression="Proposer_Name" UniqueName="Proposer_Name">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Client_Type" 
                                                                        FilterControlAltText="Filter Client_Type column" HeaderText="Client_Type" 
                                                                        SortExpression="Client_Type" UniqueName="Client_Type">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Business_Type" 
                                                                        FilterControlAltText="Filter Business_Type column" HeaderText="Type" 
                                                                        SortExpression="Business_Type" UniqueName="Business_Type">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="File_Status" 
                                                                        FilterControlAltText="Filter File_Status column" HeaderText="Status" 
                                                                        SortExpression="File_Status" UniqueName="File_Status">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Allocated_to" 
                                                                        FilterControlAltText="Filter Allocated_to column" HeaderText="Allocated_to" 
                                                                        SortExpression="Allocated_to" UniqueName="Allocated_to">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Walk_in_Client" 
                                                                        FilterControlAltText="Filter Walk_in_Client column" HeaderText="Walk_in" 
                                                                        SortExpression="Walk_in_Client" UniqueName="Walk_in_Client">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Is_Branch" 
                                                                        FilterControlAltText="Filter Is_Branch column" HeaderText="Is_Branch" 
                                                                        SortExpression="Is_Branch" UniqueName="Is_Branch">
                                                                    </telerik:GridBoundColumn>
                                                                </Columns>
                                                                <EditFormSettings>
                                                                    <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                    </EditColumn>
                                                                </EditFormSettings>
                                                            </MasterTableView>
                                                            <ItemStyle Wrap="False" />
                                                            <FilterMenu EnableImageSprites="False">
                                                            </FilterMenu>
                                                            <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                            </HeaderContextMenu>
                                                        </telerik:RadGrid>
                                                    </asp:Panel>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="width: 1025px">
                                                    <asp:Label ID="FILE_NO" runat="server" Font-Bold="True" Font-Size="Medium" 
                                                        style="font-weight: 700; color: #CC0000; background-color: #FFFFFF"></asp:Label>
                                                </td>
                                                <td style="width: 125px">
                                                    &nbsp;</td>
                                                <td style="width: 264px">
                                                    &nbsp;</td>
                                                <td>
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td colspan="4">
                                                    <asp:Panel ID="Panel11" runat="server" Height="100%" ScrollBars="Both" 
                                                        Width="1128px">
                                                        <telerik:RadGrid ID="GDTracking" runat="server" AllowPaging="True" 
                                                            CellSpacing="0" GridLines="None" Height="100%" PageSize="20" Skin="Web20" 
                                                            Width="100%">
                                                            <MasterTableView AutoGenerateColumns="False" DataKeyNames="File_No">
                                                                <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                    <HeaderStyle Width="20px" />
                                                                </RowIndicatorColumn>
                                                                <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                    <HeaderStyle Width="20px" />
                                                                </ExpandCollapseColumn>
                                                                <Columns>
                                                                    <telerik:GridButtonColumn CommandName="Select" 
                                                                        FilterControlAltText="Filter Select column" HeaderText="Select" Text="Select" 
                                                                        UniqueName="Select">
                                                                        <HeaderStyle ForeColor="Blue" Width="100px" />
                                                                        <ItemStyle Width="50px" />
                                                                    </telerik:GridButtonColumn>
                                                                        <telerik:GridBoundColumn DataField="Allocate_dt" 
                                                                        FilterControlAltText="Filter Allocate_dt column" HeaderText="Allocate_dt" 
                                                                        SortExpression="Allocate_dt" UniqueName="Allocate_dt">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="File_No" 
                                                                        FilterControlAltText="Filter File_No column" HeaderText="File_No" 
                                                                        SortExpression="File_No" UniqueName="File_No">
                                                                    </telerik:GridBoundColumn>
                                                                     <telerik:GridBoundColumn DataField="eOx_Invoice_No" 
                                                                        FilterControlAltText="Filter eOx_Invoice_No column" HeaderText="Invoice_No" 
                                                                        SortExpression="eOx_Invoice_No" UniqueName="eOx_Invoice_No">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Proposer_Name" 
                                                                        FilterControlAltText="Filter Proposer_Name column" HeaderText="Proposer_Name" 
                                                                        SortExpression="Proposer_Name" UniqueName="Proposer_Name">
                                                                    </telerik:GridBoundColumn>
                                                                     <telerik:GridBoundColumn DataField="Client_Type" 
                                                                        FilterControlAltText="Filter Client_Type column" HeaderText="Client_Type" 
                                                                        SortExpression="Client_Type" UniqueName="Client_Type">
                                                                    </telerik:GridBoundColumn>   
                                                                    <telerik:GridBoundColumn DataField="Business_Type" 
                                                                        FilterControlAltText="Filter Business_Type column" HeaderText="Type" 
                                                                        SortExpression="Business_Type" UniqueName="Business_Type">
                                                                    </telerik:GridBoundColumn>                                                   
                                                                    <telerik:GridBoundColumn DataField="File_Status" 
                                                                        FilterControlAltText="Filter File_Status column" HeaderText="Status" 
                                                                        SortExpression="File_Status" UniqueName="File_Status">
                                                                    </telerik:GridBoundColumn>
                                                                       <telerik:GridBoundColumn DataField="Allocated_to" 
                                                                        FilterControlAltText="Filter Allocated_to column" HeaderText="Allocated_to" 
                                                                        SortExpression="Allocated_to" UniqueName="Allocated_to">
                                                                    </telerik:GridBoundColumn>
                                                                <telerik:GridBoundColumn DataField="Walk_in_Client" 
                                                                        FilterControlAltText="Filter Walk_in_Client column" HeaderText="Walk_in" 
                                                                        SortExpression="Walk_in_Client" UniqueName="Walk_in_Client">
                                                                    </telerik:GridBoundColumn>
                                                                     <telerik:GridBoundColumn DataField="Product" 
                                                                        FilterControlAltText="Filter Product column" HeaderText="Product" 
                                                                        SortExpression="Product" UniqueName="Product">
                                                                    </telerik:GridBoundColumn>
                                                                           <telerik:GridBoundColumn DataField="Syst" 
                                                                        FilterControlAltText="Filter Syst column" HeaderText="System" 
                                                                        SortExpression="Syst" UniqueName="Syst">
                                                                    </telerik:GridBoundColumn>
                                                                </Columns>
                                                                <EditFormSettings>
                                                                    <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                    </EditColumn>
                                                                </EditFormSettings>
                                                            </MasterTableView>
                                                            <ItemStyle Wrap="False" />
                                                            <FilterMenu EnableImageSprites="False">
                                                            </FilterMenu>
                                                            <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                            </HeaderContextMenu>
                                                        </telerik:RadGrid>
                                                    </asp:Panel>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <asp:Panel ID="Panel2" runat="server">
                                            <table style="width: 99%">
                                                <tr>
                                                    <td>
                                                        <asp:Label ID="Label174" runat="server" Font-Bold="True" Text="AAR Protect"></asp:Label>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <asp:Panel ID="Panel5" runat="server" Height="100%" ScrollBars="Both" 
                                                            Width="1128px">
                                                            <telerik:RadGrid ID="GD_PROTECT" runat="server" AllowPaging="True" 
                                                                CellSpacing="0" GridLines="None" Height="100%" PageSize="20" Skin="Web20" 
                                                                Width="100%">
                                                                <MasterTableView AutoGenerateColumns="False">
                                                                    <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                    <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                        <HeaderStyle Width="20px" />
                                                                    </RowIndicatorColumn>
                                                                    <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                        <HeaderStyle Width="20px" />
                                                                    </ExpandCollapseColumn>
                                                                    <Columns>
                                                                        <telerik:GridBoundColumn DataField="Payment_Unique_ID" 
                                                                            FilterControlAltText="Filter Payment_Unique_ID column" HeaderText="File_No" 
                                                                            SortExpression="Payment_Unique_ID" UniqueName="Payment_Unique_ID">
                                                                        </telerik:GridBoundColumn>
                                                                        <telerik:GridBoundColumn DataField="Application_ID" 
                                                                            FilterControlAltText="Filter Application_ID column" HeaderText="Application_ID" 
                                                                            SortExpression="Application_ID" UniqueName="Application_ID">
                                                                        </telerik:GridBoundColumn>
                                                                        <telerik:GridBoundColumn DataField="Application_Date" 
                                                                            FilterControlAltText="Filter Application_Date column" 
                                                                            HeaderText="Application_Date" SortExpression="Application_Date" 
                                                                            UniqueName="Application_Date">
                                                                        </telerik:GridBoundColumn>
                                                                        <telerik:GridBoundColumn DataField="ID_Number" 
                                                                            FilterControlAltText="Filter ID_Number column" HeaderText="ID_Number" 
                                                                            SortExpression="ID_Number" UniqueName="ID_Number">
                                                                        </telerik:GridBoundColumn>
                                                                        <telerik:GridBoundColumn DataField="Name" 
                                                                            FilterControlAltText="Filter Name column" HeaderText="Name" 
                                                                            SortExpression="Name" UniqueName="Name">
                                                                        </telerik:GridBoundColumn>
                                                                        <telerik:GridBoundColumn DataField="KRA_Pin" 
                                                                            FilterControlAltText="Filter KRA_Pin column" HeaderText="KRA_Pin" 
                                                                            SortExpression="KRA_Pin" UniqueName="KRA_Pin">
                                                                        </telerik:GridBoundColumn>
                                                                        <telerik:GridBoundColumn DataField="Gender" 
                                                                            FilterControlAltText="Filter Gender column" HeaderText="Gender" 
                                                                            SortExpression="Gender" UniqueName="Gender">
                                                                        </telerik:GridBoundColumn>
                                                                        <telerik:GridBoundColumn DataField="Email" 
                                                                            FilterControlAltText="Filter Email column" HeaderText="Email" 
                                                                            SortExpression="Email" UniqueName="Email">
                                                                        </telerik:GridBoundColumn>
                                                                        <telerik:GridBoundColumn DataField="Phone" 
                                                                            FilterControlAltText="Filter Phone column" HeaderText="Phone" 
                                                                            SortExpression="Phone" UniqueName="Phone">
                                                                        </telerik:GridBoundColumn>
                                                                        <telerik:GridBoundColumn DataField="Period" 
                                                                            FilterControlAltText="Filter Period column" HeaderText="Period" 
                                                                            SortExpression="Period" UniqueName="Period">
                                                                        </telerik:GridBoundColumn>
                                                                        <telerik:GridBoundColumn DataField="Dob" 
                                                                            FilterControlAltText="Filter Dob column" HeaderText="Dob" SortExpression="Dob" 
                                                                            UniqueName="Dob">
                                                                        </telerik:GridBoundColumn>
                                                                        <telerik:GridBoundColumn DataField="Agent_Name" 
                                                                            FilterControlAltText="Filter Agent_Name column" HeaderText="Agent_Name" 
                                                                            SortExpression="Agent_Name" UniqueName="Agent_Name">
                                                                        </telerik:GridBoundColumn>
                                                                        <telerik:GridBoundColumn DataField="Next_of_Kin" 
                                                                            FilterControlAltText="Filter Next_of_Kin column" HeaderText="Next_of_Kin" 
                                                                            SortExpression="Next_of_Kin" UniqueName="Next_of_Kin">
                                                                        </telerik:GridBoundColumn>
                                                                        <telerik:GridBoundColumn DataField="Limit" DataFormatString="{0:### ##0.0}" 
                                                                            FilterControlAltText="Filter Limit column" HeaderText="Limit" 
                                                                            SortExpression="Limit" UniqueName="Limit">
                                                                        </telerik:GridBoundColumn>
                                                                        <telerik:GridBoundColumn DataField="Premium_Amount" 
                                                                            DataFormatString="{0:### ##0.0}" 
                                                                            FilterControlAltText="Filter Premium_Amount column" HeaderText="Premium_Amount" 
                                                                            SortExpression="Premium_Amount" UniqueName="Premium_Amount">
                                                                        </telerik:GridBoundColumn>
                                                                        <telerik:GridBoundColumn DataField="Amount_Paid" 
                                                                            DataFormatString="{0:### ##0.0}" 
                                                                            FilterControlAltText="Filter Amount_Paid column" HeaderText="Amount_Paid" 
                                                                            SortExpression="Amount_Paid" UniqueName="Amount_Paid">
                                                                        </telerik:GridBoundColumn>
                                                                        <telerik:GridBoundColumn DataField="Cover_Start_Date" 
                                                                            FilterControlAltText="Filter Cover_Start_Date column" HeaderText="Start_Date" 
                                                                            SortExpression="Cover_Start_Date" UniqueName="Cover_Start_Date">
                                                                        </telerik:GridBoundColumn>
                                                                        <telerik:GridBoundColumn DataField="[Cover_ End_Date]" 
                                                                            FilterControlAltText="Filter Cover_End_Date column" HeaderText="End_Date" 
                                                                            SortExpression="Cover_End_Date" UniqueName="Cover_End_Date">
                                                                        </telerik:GridBoundColumn>
                                                                    </Columns>
                                                                    <EditFormSettings>
                                                                        <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                        </EditColumn>
                                                                    </EditFormSettings>
                                                                </MasterTableView>
                                                                <ItemStyle Wrap="False" />
                                                                <FilterMenu EnableImageSprites="False">
                                                                </FilterMenu>
                                                                <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                                </HeaderContextMenu>
                                                            </telerik:RadGrid>
                                                        </asp:Panel>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <asp:Label ID="Label147" runat="server" Font-Bold="True" Text="Documentation"></asp:Label>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <asp:Panel ID="Panel30" runat="server" Height="100%" ScrollBars="Both" 
                                                            Width="1100px">
                                                            <telerik:RadGrid ID="GD_DOCS" runat="server" AllowPaging="True" CellSpacing="0" 
                                                                GridLines="None" Height="100%" Skin="Web20" Width="100%">
                                                                <MasterTableView AutoGenerateColumns="False" DataKeyNames="DOC_ID">
                                                                    <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                    <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                        <HeaderStyle Width="20px" />
                                                                    </RowIndicatorColumn>
                                                                    <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                        <HeaderStyle Width="20px" />
                                                                    </ExpandCollapseColumn>
                                                                    <Columns>
                                                                        <telerik:GridBoundColumn DataField="DOC_ID" 
                                                                            FilterControlAltText="Filter DOC_ID column" HeaderText="DOC_ID" 
                                                                            SortExpression="DOC_ID" UniqueName="DOC_ID">
                                                                        </telerik:GridBoundColumn>
                                                                        <telerik:GridBoundColumn DataField="File_No" 
                                                                            FilterControlAltText="Filter File_No column" HeaderText="File No" 
                                                                            SortExpression="File_No" UniqueName="File_No">
                                                                        </telerik:GridBoundColumn>
                                                                        <telerik:GridBoundColumn DataField="Doc_Title" 
                                                                            FilterControlAltText="Filter Doc_Title column" HeaderText="Doc_Title" 
                                                                            SortExpression="Doc_Title" UniqueName="Doc_Title">
                                                                        </telerik:GridBoundColumn>
                                                                        <telerik:GridBoundColumn DataField="Doc_Date" 
                                                                            FilterControlAltText="Filter Doc_Date column" HeaderText="Doc_Date" 
                                                                            SortExpression="Doc_Date" UniqueName="Doc_Date">
                                                                        </telerik:GridBoundColumn>
                                                                        <telerik:GridBoundColumn DataField="File_Name" 
                                                                            FilterControlAltText="Filter File_Name column" HeaderText="File_Name" 
                                                                            SortExpression="File_Name" UniqueName="File_Name">
                                                                        </telerik:GridBoundColumn>
                                                                           <telerik:GridBoundColumn DataField="Doc_Ref" 
                                                                                    FilterControlAltText="Filter Doc_Ref column" HeaderText="Doc_Ref" 
                                                                                    SortExpression="Doc_Ref" UniqueName="Doc_Ref">
                                                                                </telerik:GridBoundColumn>
                                                                        <telerik:GridBoundColumn DataField="Upload_By" 
                                                                            FilterControlAltText="Filter Upload_By column" HeaderText="Upload_By" 
                                                                            SortExpression="Upload_By" UniqueName="Upload_By">
                                                                        </telerik:GridBoundColumn>
                                                                        <telerik:GridTemplateColumn AllowFiltering="false" HeaderText="View" 
                                                                            SortExpression="DOC_ID">
                  <ItemTemplate>
                  <asp:LinkButton ID="lnkDownload" runat="server" Text="Download" OnClick="DownloadFile"
                    CommandArgument='<%# Eval("DOC_ID") %>'></asp:LinkButton>
                  </ItemTemplate>
                                                                        </telerik:GridTemplateColumn>
                                                                    </Columns>
                                                                    <EditFormSettings>
                                                                        <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                        </EditColumn>
                                                                    </EditFormSettings>
                                                                </MasterTableView>
                                                                <FilterMenu EnableImageSprites="False">
                                                                </FilterMenu>
                                                                <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                                </HeaderContextMenu>
                                                            </telerik:RadGrid>
                                                        </asp:Panel>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <asp:Panel ID="Panel13" runat="server" BorderStyle="Solid" Height="100%" 
                                                            ScrollBars="Horizontal" Width="1071px">
                                                            <asp:Literal ID="ltEmbed" runat="server" />
                                                        </asp:Panel>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="height: 17px;">
                                                        <asp:Label ID="lblprop" runat="server"></asp:Label>
                                                    </td>
                                                </tr>
                                            </table>
                                        </asp:Panel>
                                    </td>
                                </tr>
                                <tr>
                                    <td bgcolor="#666666">
                                        &nbsp;</td>
                                </tr>
                                <tr>
                                    <td style="height: 34px">
                                        <table style="width: 100%">
                                            <tr>
                                                <td style="width: 193px">
                                                    &nbsp;</td>
                                                <td style="width: 246px">
                                                    <asp:Label ID="Label170" runat="server" Text="Upload Docs"></asp:Label>
                                                </td>
                                                <td>
                                                    &nbsp;</td>
                                                <td>
                                                    <asp:Label ID="lblclient" runat="server"></asp:Label>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="width: 193px">
                                                    &nbsp;</td>
                                                <td style="width: 246px">
                                                    <telerik:RadComboBox ID="cbodoc" Runat="server" MarkFirstMatch="True" 
                                                        Skin="Web20" Width="250px">
                                                    </telerik:RadComboBox>
                                                </td>
                                                <td>
                                                    <asp:Label ID="Label153" runat="server" Text="Invoice No"></asp:Label>
                                                </td>
                                                <td>
                                                    <telerik:RadTextBox ID="txtinv" Runat="server" Enabled="False" Skin="Web20" 
                                                        Width="250px">
                                                    </telerik:RadTextBox>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="width: 193px">
                                                    &nbsp;</td>
                                                <td style="width: 246px">
                                                    <asp:FileUpload ID="FL2" runat="server" Width="330px" />
                                                </td>
                                                <td>
                                                    <asp:Label ID="Label156" runat="server" Text="Policy Code"></asp:Label>
                                                </td>
                                                <td>
                                                    <telerik:RadTextBox ID="policy" Runat="server" Skin="Web20" Width="250px">
                                                    </telerik:RadTextBox>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="width: 193px">
                                                    &nbsp;</td>
                                                <td style="width: 246px">
                                                    <telerik:RadButton ID="btnupload_1" runat="server" Skin="Simple" Text="Upload">
                                                    </telerik:RadButton>
                                                    <asp:Label ID="LBLUPLOAD" runat="server"></asp:Label>
                                                </td>
                                                <td>
                                                    &nbsp;</td>
                                                <td>
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td colspan="4">
                                                    <hr />
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="width: 193px">
                                                    <asp:Label ID="Label150" runat="server" Text="Action"></asp:Label>
                                                </td>
                                                <td style="width: 246px">
                                                    <telerik:RadComboBox ID="cboAction" Runat="server" MarkFirstMatch="True" 
                                                        Skin="Web20" Width="190px">
                                                        <Items>
                                                            <telerik:RadComboBoxItem runat="server" Owner="cboAction" />
                                                            <telerik:RadComboBoxItem runat="server" Text="Policy Generated" Value="P" />
                                                            <telerik:RadComboBoxItem runat="server" Owner="cboAction" Text="Filing" 
                                                                Value="F" />
                                                            <telerik:RadComboBoxItem runat="server" Text="IT Issue" Value="IT" />
                                                        </Items>
                                                    </telerik:RadComboBox>
                                                </td>
                                                <td>
                                                    <asp:Label ID="Label171" runat="server" Text="RM"></asp:Label>
                                                </td>
                                                <td>
                                                    <asp:Label ID="lblRM" runat="server"></asp:Label>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="width: 193px">
                                                    <asp:Label ID="Label154" runat="server" Text="Entered By"></asp:Label>
                                                </td>
                                                <td style="width: 246px">
                                                    <asp:Label ID="lblenteredby" runat="server"></asp:Label>
                                                </td>
                                                <td>
                                                    <asp:Label ID="Label172" runat="server" Text="Agent"></asp:Label>
                                                </td>
                                                <td>
                                                    <asp:Label ID="lblagent" runat="server"></asp:Label>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="width: 193px">
                                                    &nbsp;</td>
                                                <td style="width: 246px">
                                                    <asp:CheckBox ID="chkPrem" runat="server" Text="Premium above 10M" />
                                                </td>
                                                <td>
                                                    &nbsp;</td>
                                                <td>
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td style="width: 193px">
                                                    <asp:Label ID="Label144" runat="server" Text="Notes"></asp:Label>
                                                </td>
                                                <td rowspan="2">
                                                    <telerik:RadTextBox ID="txtcomment" Runat="server" Height="50px" Skin="Web20" 
                                                        TextMode="MultiLine" Width="450px">
                                                    </telerik:RadTextBox>
                                                </td>
                                                <td>
                                                    <asp:Label ID="Label155" runat="server" Text="updated by"></asp:Label>
                                                </td>
                                                <td>
                                                    <asp:Label ID="lblupdateby" runat="server"></asp:Label>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="width: 193px">
                                                    &nbsp;</td>
                                                <td colspan="2">
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td style="width: 193px; height: 38px;">
                                                </td>
                                                <td style="height: 38px;">
                                                    <telerik:RadButton ID="btnforward" runat="server" Skin="Simple" Text="Forward " 
                                                        Width="200px">
                                                    </telerik:RadButton>
                                                </td>
                                                <td colspan="2" style="height: 38px">
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="height: 41px">
                                        &nbsp;<asp:Label ID="lblerr" runat="server" Font-Bold="True" ForeColor="Red" 
                                            Font-Size="Medium"></asp:Label>
                                        <asp:HiddenField ID="HiddenField1" runat="server" />
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <asp:Panel ID="Panel15" runat="server" Height="100%" ScrollBars="Both" 
                                            Width="100%">
                                            <telerik:RadGrid ID="GDNOTES" runat="server" AllowPaging="True" CellSpacing="0" 
                                                GridLines="None" Height="100%" Skin="Web20" Width="100%">
                                                <MasterTableView AutoGenerateColumns="False">
                                                    <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                    <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                    </RowIndicatorColumn>
                                                    <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                    </ExpandCollapseColumn>
                                                    <Columns>
                                                        <telerik:GridBoundColumn DataField="Note_date" 
                                                            FilterControlAltText="Filter Note_date column" HeaderText="Note date" 
                                                            ItemStyle-Width="100" SortExpression="Note_date" UniqueName="Note_date">
                                                            <ItemStyle Width="100px" />
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="File_No" 
                                                            FilterControlAltText="Filter File_No column" HeaderText="File No" 
                                                            ItemStyle-Width="50" SortExpression="File_No" UniqueName="File_No">
                                                            <ItemStyle Width="50px" />
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Note_From" 
                                                            FilterControlAltText="Filter Note_From column" HeaderText="From" 
                                                            ItemStyle-Width="100" SortExpression="Note_From" UniqueName="Note_From">
                                                            <ItemStyle Width="100px" />
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Notes" 
                                                            FilterControlAltText="Filter Notes column" HeaderText="Notes" 
                                                            SortExpression="Notes" UniqueName="Notes">
                                                        </telerik:GridBoundColumn>
                                                    </Columns>
                                                    <EditFormSettings>
                                                        <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                        </EditColumn>
                                                    </EditFormSettings>
                                                </MasterTableView>
                                                <ItemStyle Wrap="False" />
                                                <FilterMenu EnableImageSprites="False">
                                                </FilterMenu>
                                                <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                </HeaderContextMenu>
                                            </telerik:RadGrid>
                                        </asp:Panel>
                                    </td>
                                </tr>
                            </table>
                        </asp:Panel>
                                        </td>
                                </tr>
                            </table>
   </asp:Panel>
   </div>
            </ContentTemplate>
         <Triggers>
        <asp:PostBackTrigger ControlID = "btnupload_1" />
          </Triggers>
            </asp:UpdatePanel>
</asp:Content>

