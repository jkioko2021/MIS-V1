<%@ Page Title="" Language="VB" MasterPageFile="~/MasterPage.master" AutoEventWireup="false" CodeFile="Business_Tracking_Not_Paid.aspx.vb" Inherits="_Default" %>

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
                                                    <telerik:RadComboBox ID="cbosearch" Runat="server" Skin="Sunset" Width="190px">
                                                        <Items>
                                                            <telerik:RadComboBoxItem runat="server" Text="File No." Value="F" />
                                                            <telerik:RadComboBoxItem runat="server" Text="Name" Value="N" />
                                                            <telerik:RadComboBoxItem runat="server" Text="Cashier" Value="C" />
                                                            <telerik:RadComboBoxItem runat="server" Text="Invoice_No" Value="I" />
                                                        </Items>
                                                    </telerik:RadComboBox>
                                                </td>
                                                <td style="width: 264px">
                                                    <telerik:RadComboBox ID="cbo_1" Runat="server" AllowCustomText="True" 
                                                        AutoPostBack="True" MarkFirstMatch="True" Skin="Sunset" Width="250px">
                                                    </telerik:RadComboBox>
                                                </td>
                                                <td>
                                                    <telerik:RadButton ID="btnsearch" runat="server" Text="Search" Skin="Simple">
                                                    </telerik:RadButton>
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
                                                            CellSpacing="0" GridLines="None" Height="100%" PageSize="20" Skin="Sunset" 
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
                                                                    <telerik:GridBoundColumn DataField="To_Cashier_dt" 
                                                                        FilterControlAltText="Filter To_Cashier_dt column" HeaderText="Date" 
                                                                        SortExpression="To_Cashier_dt" UniqueName="To_Cashier_dt">
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
                                                                        FilterControlAltText="Filter Allocated_to column" HeaderText="Updated_By" 
                                                                        SortExpression="Allocated_to" UniqueName="Allocated_to">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="BRANCH_NAME" 
                                                                        FilterControlAltText="Filter BRANCH_NAME column" HeaderText="BRANCH_NAME" 
                                                                        SortExpression="BRANCH_NAME" UniqueName="BRANCH_NAME">
                                                                    </telerik:GridBoundColumn>
                                                                      <telerik:GridBoundColumn DataField="Product" 
                                                                        FilterControlAltText="Filter Product column" HeaderText="Product" 
                                                                        SortExpression="Product" UniqueName="Product">
                                                                    </telerik:GridBoundColumn>
                                                                           <telerik:GridBoundColumn DataField="Syst" 
                                                                        FilterControlAltText="Filter Syst column" HeaderText="System" 
                                                                        SortExpression="Syst" UniqueName="Syst">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Walk_In_Client" 
                                                                        FilterControlAltText="Filter Walk_In_Client column" HeaderText="Walk_In" 
                                                                        SortExpression="Walk_In_Client" UniqueName="Walk_In_Client">
                                                                    </telerik:GridBoundColumn>
                                                                      <telerik:GridBoundColumn DataField="Entered_By" 
                                                                        FilterControlAltText="Filter Entered_By column" HeaderText="Entered_By" 
                                                                        SortExpression="Entered_By" UniqueName="Entered_By">
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
                                                <td colspan="4">
                                                    <asp:Label ID="Label159" runat="server" Text="Payment Status"></asp:Label>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colspan="4">
                                                    <asp:Panel ID="Panel32" runat="server" Height="100%" ScrollBars="Both" 
                                                        Width="1128px">
                                                        <telerik:RadGrid ID="GD_Pay" runat="server" AllowPaging="True" CellSpacing="0" 
                                                            GridLines="None" Height="100%" PageSize="20" Skin="Sunset" Width="100%">
                                                            <MasterTableView AutoGenerateColumns="False" DataKeyNames="File_No">
                                                                <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                    <HeaderStyle Width="20px" />
                                                                </RowIndicatorColumn>
                                                                <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                    <HeaderStyle Width="20px" />
                                                                </ExpandCollapseColumn>
                                                                <Columns>
                                                                    <telerik:GridBoundColumn DataField="File_No" 
                                                                        FilterControlAltText="Filter File_No column" HeaderText="File_No" 
                                                                        SortExpression="File_No" UniqueName="File_No">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Proposer_Name" 
                                                                        FilterControlAltText="Filter Proposer_Name column" HeaderText="Proposer_Name" 
                                                                        SortExpression="Proposer_Name" UniqueName="Proposer_Name">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Client_Type" 
                                                                        FilterControlAltText="Filter Client_Type column" HeaderText="Client_Type" 
                                                                        SortExpression="Client_Type" UniqueName="Client_Type">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Premium" DataFormatString="{0:### ##0.0}" 
                                                                        FilterControlAltText="Filter Premium column" HeaderText="Premium" 
                                                                        SortExpression="Premium" UniqueName="Premium">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Paid_Amt" DataFormatString="{0:### ##0.0}" 
                                                                        FilterControlAltText="Filter Paid_Amt column" HeaderText="Paid_Amt" 
                                                                        SortExpression="Paid_Amt" UniqueName="Paid_Amt">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Pay_Ref_No" 
                                                                        FilterControlAltText="Filter Pay_Ref_No column" HeaderText="Pay_Ref_No" 
                                                                        SortExpression="Pay_Ref_No" UniqueName="Pay_Ref_No">
                                                                    </telerik:GridBoundColumn>
                                                                                                                                                                                                           
                                                                    <telerik:GridBoundColumn DataField="File_Status" 
                                                                        FilterControlAltText="Filter File_Status column" HeaderText="File_Status" 
                                                                        SortExpression="File_Status" UniqueName="File_Status">
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
                                                <td colspan="4">
                                                    <asp:Label ID="Label173" runat="server" Text="Total Paid Amt:"></asp:Label>
                                                    <telerik:RadNumericTextBox ID="txtpaid" Runat="server" Culture="en-US" 
                                                        Skin="Sunset" Value="0" Width="200px">
                                                    </telerik:RadNumericTextBox>
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
                                                        <asp:Label ID="Label147" runat="server" Font-Bold="True" Text="Documentation"></asp:Label>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <asp:Panel ID="Panel30" runat="server" Height="100%" ScrollBars="Both" 
                                                            Width="1100px">
                                                            <telerik:RadGrid ID="GD_DOCS" runat="server" AllowPaging="True" CellSpacing="0" 
                                                                GridLines="None" Height="100%" Skin="Sunset" Width="100%">
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
                                                        <asp:Label ID="txtproposer" runat="server" Font-Bold="True"></asp:Label>
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
                                                    <asp:Label ID="Label158" runat="server" Text="Attach Receipt"></asp:Label>
                                                </td>
                                                <td style="width: 246px">
                                                    <telerik:RadComboBox ID="cbodoc" Runat="server" MarkFirstMatch="True" 
                                                        Skin="Sunset" Width="250px">
                                                    </telerik:RadComboBox>
                                                </td>
                                                <td>
                                                    <asp:Label ID="Label153" runat="server" Text="Invoice No"></asp:Label>
                                                </td>
                                                <td>
                                                    <telerik:RadTextBox ID="txtinv" Runat="server" Enabled="False" Skin="Sunset" 
                                                        Width="250px">
                                                    </telerik:RadTextBox>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="width: 193px">
                                                    &nbsp;</td>
                                                <td style="width: 246px">
                                                    <asp:FileUpload ID="FL1" runat="server" Width="330px" />
                                                </td>
                                                <td>
                                                    &nbsp;</td>
                                                <td>
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td style="width: 193px">
                                                    &nbsp;</td>
                                                <td style="width: 246px">
                                                    <telerik:RadButton ID="btnupload" runat="server" Skin="Simple" Text="Upload">
                                                    </telerik:RadButton>
                                                    <asp:Label ID="UPLOAD" runat="server"></asp:Label>
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
                                                    <telerik:RadComboBox ID="cboAction" Runat="server" AllowCustomText="True" 
                                                        AutoPostBack="True" MarkFirstMatch="True" Skin="Sunset" Width="190px">
                                                        <Items>
                                                            <telerik:RadComboBoxItem runat="server" Owner="cboAction" />
                                                            <telerik:RadComboBoxItem runat="server" Owner="cboAction" Text="Cashier" 
                                                                Value="C" />
                                                        </Items>
                                                    </telerik:RadComboBox>
                                                </td>
                                                <td>
                                                    <asp:Label ID="Label169" runat="server" Text="Cheque/EFT No/Mpesa"></asp:Label>
                                                </td>
                                                <td>
                                                    <telerik:RadTextBox ID="txtrefno" Runat="server" Skin="Sunset" Width="250px">
                                                    </telerik:RadTextBox>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="width: 193px">
                                                    &nbsp;</td>
                                                <td style="width: 246px">
                                                    &nbsp;</td>
                                                <td>
                                                    <asp:Label ID="Label172" runat="server" Text="Amt To Receipt"></asp:Label>
                                                </td>
                                                <td>
                                                    <telerik:RadNumericTextBox ID="txtreceiptamt" Runat="server" Culture="en-US" 
                                                        Skin="Sunset" Value="0" Width="200px">
                                                    </telerik:RadNumericTextBox>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="width: 193px">
                                                    <asp:Label ID="Label155" runat="server" Text="updated by"></asp:Label>
                                                </td>
                                                <td style="width: 246px">
                                                    <asp:Label ID="lblupdateby" runat="server"></asp:Label>
                                                </td>
                                                <td>
                                                    &nbsp;</td>
                                                <td>
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td style="width: 193px">
                                                    <asp:Label ID="Label154" runat="server" Text="Entered By"></asp:Label>
                                                </td>
                                                <td style="width: 246px">
                                                    <asp:Label ID="lblenteredby" runat="server"></asp:Label>
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
                                                    <telerik:RadTextBox ID="txtcomment" Runat="server" Height="50px" Skin="Sunset" 
                                                        TextMode="MultiLine" Width="450px">
                                                    </telerik:RadTextBox>
                                                </td>
                                                <td colspan="2">
                                                    &nbsp;</td>
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
                                            Width="1100px">
                                            <telerik:RadGrid ID="GDNOTES" runat="server" AllowPaging="True" CellSpacing="0" 
                                                GridLines="None" Height="100%" Skin="Sunset" Width="100%">
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
        <asp:PostBackTrigger ControlID = "btnupload" />
          </Triggers>
            </asp:UpdatePanel>
</asp:Content>


