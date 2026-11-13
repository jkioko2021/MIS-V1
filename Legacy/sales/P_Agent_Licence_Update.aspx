<%@ Page Title="" Language="VB" MasterPageFile="~/MasterPage.master" AutoEventWireup="false" CodeFile="P_Agent_Licence_Update.aspx.vb" Inherits="Default2" %>

<%@ OutputCache Location="None" %>
<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="cc1" %>
<%@ Register assembly="Telerik.Web.UI" namespace="Telerik.Web.UI" tagprefix="telerik" %>
<asp:Content ID="Content1" ContentPlaceHolderID="ContentPlaceHolder1" Runat="Server">
    <asp:UpdateProgress ID="UpdateProgress1" runat="server">
        <ProgressTemplate>
         <asp:Label ID="lblProgress" runat="server" Font-Bold="True" ForeColor="#153E7E" Text="Please Wait...."></asp:Label>
        </ProgressTemplate>
    </asp:UpdateProgress>
    <asp:UpdatePanel ID="UpdatePanel1" runat="server">
        <ContentTemplate>
            <table style="width: 100%" align="center">
                <tr>
                    <td align="center" bgcolor="#333333" colspan="2">
                        <asp:Label ID="Label6" runat="server" Font-Bold="True" Font-Size="Medium" 
                            ForeColor="Silver" style="font-weight: 700" 
                            Text="LICENCE UPDATE"></asp:Label>
                    </td>
                </tr>
                <tr>
                    <td>
                        <asp:Panel ID="Panel8" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                            Width="1120px">
                            <table style="width: 100%">
                                <tr>
                                    <td style="width: 580px">
                                        <asp:Label ID="Label73" runat="server" style="font-weight: 700" 
                                            Text="Search By"></asp:Label>
                                    </td>
                                    <td style="width: 154px">
                                        <telerik:RadComboBox ID="cbosearch" Runat="server" style="margin-left: 0px">
                                            <Items>
                                                <telerik:RadComboBoxItem runat="server" Text="Name" Value="N" />
                                                <telerik:RadComboBoxItem runat="server" Text="Agent Code" Value="A" />
                                                <telerik:RadComboBoxItem runat="server" Text="Payroll No" Value="P" />
                                            </Items>
                                        </telerik:RadComboBox>
                                    </td>
                                    <td>
                                        <telerik:RadTextBox ID="txtsearch" Runat="server" Width="250px">
                                        </telerik:RadTextBox>
                                    </td>
                                    <td>
                                        <telerik:RadButton ID="SEARCH" runat="server" Text="Search">
                                        </telerik:RadButton>
                                    </td>
                                </tr>
                            </table>
                        </asp:Panel>
                    </td>
                    <td>
                        &nbsp;</td>
                </tr>
                <tr>
                    <td>
                        <asp:Panel ID="Panel34" runat="server" Height="100%" ScrollBars="Both" 
                            Width="1120px">
                            <telerik:RadGrid ID="GDSEARCH_1" runat="server" AllowPaging="True" 
                                CellSpacing="0" GridLines="None" Height="100%" Skin="WebBlue" Width="100%">
                                <MasterTableView AutoGenerateColumns="False" DataKeyNames="Ref_No">
                                    <CommandItemSettings ExportToPdfText="Export to PDF" />
                                    <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                        <HeaderStyle Width="20px" />
                                    </RowIndicatorColumn>
                                    <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                        <HeaderStyle Width="20px" />
                                    </ExpandCollapseColumn>
                                    <Columns>
                                        <telerik:GridButtonColumn CommandName="Select" 
                                            FilterControlAltText="Filter ID column" HeaderText="Select" Text="Select" 
                                            UniqueName="Select">
                                            <HeaderStyle ForeColor="Blue" Width="50px" />
                                            <ItemStyle Width="50px" />
                                        </telerik:GridButtonColumn>
                                        
                                        <telerik:GridBoundColumn DataField="Ref_No" 
                                            FilterControlAltText="Filter Ref_No column" HeaderText="Ref_No" 
                                            SortExpression="Ref_No" UniqueName="Ref_No">
                                        </telerik:GridBoundColumn>
                                        <telerik:GridBoundColumn DataField="AGENT_NAME" 
                                            FilterControlAltText="Filter AGENT_NAME column" HeaderText="Name" 
                                            SortExpression="AGENT_NAME" UniqueName="AGENT_NAME">
                                        </telerik:GridBoundColumn>
                                        <telerik:GridBoundColumn DataField="Agent_Type" 
                                            FilterControlAltText="Filter Agent_Type column" HeaderText="Agent_Type" 
                                            ItemStyle-Wrap="False" SortExpression="Agent_Type" UniqueName="Agent_Type">
                                        </telerik:GridBoundColumn>
                                      
                                        <telerik:GridBoundColumn DataField="AGENT_STATUS" 
                                            FilterControlAltText="Filter AGENT_STATUS column" HeaderText="Status" 
                                            SortExpression="AGENT_STATUS" UniqueName="AGENT_STATUS">
                                        </telerik:GridBoundColumn>
                                     
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
                    <td>
                        &nbsp;</td>
                </tr>
                <tr>
                    <td>
                        <asp:Panel ID="Panel4" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                            Width="1120px">
                            <table style="width: 100%">
                                <tr>
                                    <td bgcolor="#666666" colspan="4" style="height: 13px">
                                        <asp:Label ID="Label7" runat="server" Font-Bold="True" 
                                            Text="IRA/Contract Details"></asp:Label>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="style8" colspan="4">
                                        <asp:Panel ID="Panel37" runat="server" Height="100%" ScrollBars="Both" 
                                            Width="100%">
                                            <telerik:RadGrid ID="GD_CONTRACT" runat="server" AllowPaging="True" 
                                                CellSpacing="0" GridLines="None" Height="100%" Skin="WebBlue" Width="100%">
                                                <MasterTableView AutoGenerateColumns="False" DataKeyNames="Licence_No">
                                                    <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                    <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                        <HeaderStyle Width="20px" />
                                                    </RowIndicatorColumn>
                                                    <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                        <HeaderStyle Width="20px" />
                                                    </ExpandCollapseColumn>
                                                    <Columns>                                                
                                                       <telerik:GridBoundColumn DataField="ID" FilterControlAltText="Filter ID column" 
                                                            HeaderText="ID" SortExpression="ID" UniqueName="ID">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="REF_NO" 
                                                            FilterControlAltText="Filter REF_NO column" HeaderText="Ref_No" 
                                                            SortExpression="REF_NO" UniqueName="REF_NO">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Licence_No" 
                                                            FilterControlAltText="Filter Licence_No column" HeaderText="Licence_No" 
                                                            SortExpression="Licence_No" UniqueName="Licence_No">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Valid_From" 
                                                            FilterControlAltText="Filter Valid_From column" HeaderText="Valid_From" 
                                                            ItemStyle-Wrap="False" SortExpression="Valid_From" UniqueName="Valid_From">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Valid_To" 
                                                            FilterControlAltText="Filter Valid_To column" HeaderText="Valid_To" 
                                                            SortExpression="Valid_To" UniqueName="Valid_To">
                                                        </telerik:GridBoundColumn>
                                                               <telerik:GridBoundColumn DataField="Is_Valid" 
                                                            FilterControlAltText="Filter Is_Valid column" HeaderText="Is_Valid" 
                                                            SortExpression="Is_Valid" UniqueName="Is_Valid">
                                                        </telerik:GridBoundColumn>
                                                          <telerik:GridBoundColumn DataField="Status" 
                                                            FilterControlAltText="Filter Status column" HeaderText="Status" 
                                                            SortExpression="Status" UniqueName="Status">
                                                        </telerik:GridBoundColumn>
                                                             <telerik:GridButtonColumn ButtonType="ImageButton" CommandName="Delete" 
                                                                                            ConfirmText="Delete record?" FilterControlAltText="Filter DeleteColumn column" 
                                                                                            Resizable="false" Text="Delete" UniqueName="DeleteColumn">
                                                                                            <HeaderStyle CssClass="rgHeader ButtonColumnHeader" />
                                                                                            <ItemStyle CssClass="ButtonColumn" />
                                                                                        </telerik:GridButtonColumn>
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
                                    <td class="style8" style="height: 17px; width: 126px;">
                                        &nbsp;</td>
                                    <td class="style8">
                                        <asp:Label ID="lblname" runat="server" Font-Bold="True" Font-Size="Small" 
                                            ForeColor="Red"></asp:Label>
                                    </td>
                                    <td style="width: 129px; height: 17px;">
                                        &nbsp;</td>
                                    <td style="width: 287px; height: 17px;">
                                        <asp:Label ID="lblfile" runat="server" Font-Bold="True" Font-Size="Small" 
                                            ForeColor="Red"></asp:Label>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="style8" style="height: 17px; width: 126px;">
                                        <asp:Label ID="Label196" runat="server" Text="Document Name"></asp:Label>
                                    </td>
                                    <td class="style8">
                                        <telerik:RadComboBox ID="cbodoc" Runat="server" AutoPostBack="True" 
                                            Skin="Simple" Width="210px">
                                            <Items>
                                                <telerik:RadComboBoxItem runat="server" Owner="cbodoc" Text="0" Value="0" />
                                                <telerik:RadComboBoxItem runat="server" Text="Contract/Licence" Value="C001" />
                                                <telerik:RadComboBoxItem runat="server" Owner="cbodoc" Selected="True" 
                                                    Text="Licence" Value="C003" />
                                                <telerik:RadComboBoxItem runat="server" Owner="cbodoc" Text="Others" 
                                                    Value="C002" />
                                            </Items>
                                        </telerik:RadComboBox>
                                    </td>
                                    <td style="width: 129px; height: 17px;">
                                        &nbsp;</td>
                                    <td style="width: 287px; height: 17px;">
                                        <asp:CheckBox ID="chkcon" runat="server" Text="Contract Signed" />
                                    </td>
                                </tr>
                                <tr>
                                    <td class="style8" style="height: 17px; width: 126px;">
                                        <asp:Label ID="Label158" runat="server" Text="Licence No."></asp:Label>
                                    </td>
                                    <td class="style8">
                                        <telerik:RadTextBox ID="txtlicence" Runat="server" Skin="Sunset" Width="250px">
                                        </telerik:RadTextBox>
                                    </td>
                                    <td style="width: 129px; height: 17px;">
                                        &nbsp;</td>
                                    <td style="width: 287px; height: 17px;">
                                        <asp:CheckBox ID="chkira" runat="server" Text="IRA Compliance" />
                                    </td>
                                </tr>
                                <tr>
                                    <td class="style8" style="height: 16px; width: 126px;">
                                        <asp:Label ID="Label197" runat="server" Text="Year"></asp:Label>
                                    </td>
                                    <td class="style8" style="width: 338px; height: 16px;">
                                        <telerik:RadComboBox ID="cboyear" Runat="server" AutoPostBack="True" 
                                            Skin="Simple" Width="210px">
                                            <Items>
                                                <telerik:RadComboBoxItem runat="server" Owner="cboyear" Selected="True" 
                                                    Text="2024" Value="2024" />
                                                <telerik:RadComboBoxItem runat="server" Owner="cboyear" Text="2025" 
                                                    Value="2025" />
                                                <telerik:RadComboBoxItem runat="server" Owner="cboyear" Text="2026" 
                                                    Value="2026" />
                                            </Items>
                                        </telerik:RadComboBox>
                                    </td>
                                    <td style="width: 129px; height: 16px;">
                                        &nbsp;</td>
                                    <td style="width: 287px; height: 16px;">
                                        <asp:CheckBox ID="chkkyc" runat="server" Text="KYC Compliance" />
                                    </td>
                                </tr>
                                <tr>
                                    <td class="style8" style="height: 16px; width: 126px;">
                                        <asp:Label ID="Label10" runat="server" Text="Valid From"></asp:Label>
                                    </td>
                                    <td class="style8" style="width: 338px; height: 16px;">
                                        <telerik:RadDatePicker ID="dtLicetart" Runat="server" MinDate="" Skin="Sunset">
                                            <Calendar Skin="Sunset" UseColumnHeadersAsSelectors="False" 
                                                UseRowHeadersAsSelectors="False" ViewSelectorText="x">
                                            </Calendar>
                                            <DateInput DateFormat="dd/MM/yyyy" DisplayDateFormat="dd/MM/yyyy">
                                            </DateInput>
                                            <DatePopupButton HoverImageUrl="" ImageUrl="" />
                                        </telerik:RadDatePicker>
                                    </td>
                                    <td style="width: 129px; height: 16px;">
                                        &nbsp;</td>
                                    <td style="width: 287px; height: 16px;">
                                        &nbsp;</td>
                                </tr>
                                <tr>
                                    <td class="style8" style="height: 16px; width: 126px;">
                                        <asp:Label ID="Label11" runat="server" Text="Valid To"></asp:Label>
                                    </td>
                                    <td class="style8" style="width: 338px; height: 16px;">
                                        <telerik:RadDatePicker ID="dtLiceend" Runat="server" MinDate="" Skin="Sunset">
                                            <Calendar Skin="Sunset" UseColumnHeadersAsSelectors="False" 
                                                UseRowHeadersAsSelectors="False" ViewSelectorText="x">
                                            </Calendar>
                                            <DateInput DateFormat="dd/MM/yyyy" DisplayDateFormat="dd/MM/yyyy">
                                            </DateInput>
                                            <DatePopupButton HoverImageUrl="" ImageUrl="" />
                                        </telerik:RadDatePicker>
                                    </td>
                                    <td style="width: 129px; height: 16px;">
                                        &nbsp;</td>
                                    <td style="width: 287px; height: 16px;">
                                        &nbsp;</td>
                                </tr>
                                <tr>
                                    <td class="style8" style="height: 16px; width: 126px;">
                                        &nbsp;</td>
                                    <td class="style8" style="width: 338px; height: 16px;">
                                        <asp:FileUpload ID="FL1" runat="server" Width="330px" />
                                    </td>
                                    <td style="width: 129px; height: 16px;">
                                        &nbsp;</td>
                                    <td style="width: 287px; height: 16px;">
                                        &nbsp;</td>
                                </tr>
                                <tr>
                                    <td class="style8" style="height: 16px; width: 126px;">
                                        <asp:Label ID="Label121" runat="server" style="font-weight: 700" 
                                            Text="Comments"></asp:Label>
                                    </td>
                                    <td rowspan="2">
                                        <telerik:RadTextBox ID="txtcomment" Runat="server" Height="70px" Rows="1" 
                                            Skin="Sunset" TextMode="MultiLine" Width="450px">
                                        </telerik:RadTextBox>
                                    </td>
                                    <td style="width: 129px; height: 16px;">
                                        &nbsp;</td>
                                    <td style="width: 287px; height: 16px;">
                                        &nbsp;</td>
                                </tr>
                                <tr>
                                    <td class="style8" style="height: 16px; width: 126px;">
                                        &nbsp;</td>
                                    <td style="width: 129px; height: 16px;">
                                        &nbsp;</td>
                                    <td style="width: 287px; height: 16px;">
                                        &nbsp;</td>
                                </tr>
                                <tr>
                                    <td class="style8" style="height: 16px; width: 126px;">
                                        &nbsp;</td>
                                    <td class="style8" style="width: 338px; height: 16px;">
                                        <telerik:RadButton ID="btnupload" runat="server" Skin="Simple" Text="Update">
                                        </telerik:RadButton>
                                        <asp:Label ID="lblupload" runat="server" Font-Bold="True" Font-Size="Medium" 
                                            ForeColor="Red"></asp:Label>
                                    </td>
                                    <td style="width: 129px; height: 16px;">
                                        &nbsp;</td>
                                    <td style="width: 287px; height: 16px;">
                                        <asp:HiddenField ID="HiddenField1" runat="server" />
                                    </td>
                                </tr>
                                <tr>
                                    <td bgcolor="#666666" class="style8" colspan="4" style="height: 16px; ">
                                        <asp:Label ID="Label198" runat="server" Font-Bold="True" 
                                            Text="PENDING VERIFICATION"></asp:Label>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="style8" colspan="4">
                                        <asp:Panel ID="Panel38" runat="server" Height="100%" ScrollBars="Both" 
                                            Width="100%">
                                            <telerik:RadGrid ID="GD_CONTRACT_P" runat="server" AllowPaging="True" 
                                                CellSpacing="0" GridLines="None" Height="100%" Skin="WebBlue" Width="100%">
                                                <MasterTableView AutoGenerateColumns="False">
                                                    <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                    <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                        <HeaderStyle Width="20px" />
                                                    </RowIndicatorColumn>
                                                    <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                        <HeaderStyle Width="20px" />
                                                    </ExpandCollapseColumn>
                                                    <Columns>
                                                        <telerik:GridBoundColumn DataField="ID" FilterControlAltText="Filter ID column" 
                                                            HeaderText="ID" SortExpression="ID" UniqueName="ID">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="REF_NO" 
                                                            FilterControlAltText="Filter REF_NO column" HeaderText="Ref_No" 
                                                            SortExpression="REF_NO" UniqueName="REF_NO">
                                                        </telerik:GridBoundColumn>
                                                            <telerik:GridBoundColumn DataField="Name" 
                                                            FilterControlAltText="Filter Name column" HeaderText="Name" 
                                                            SortExpression="Name" UniqueName="Name">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Licence_No" 
                                                            FilterControlAltText="Filter Licence_No column" HeaderText="Licence_No" 
                                                            SortExpression="Licence_No" UniqueName="Licence_No">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Valid_From" 
                                                            FilterControlAltText="Filter Valid_From column" HeaderText="Valid_From" 
                                                            ItemStyle-Wrap="False" SortExpression="Valid_From" UniqueName="Valid_From">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Valid_To" 
                                                            FilterControlAltText="Filter Valid_To column" HeaderText="Valid_To" 
                                                            SortExpression="Valid_To" UniqueName="Valid_To">
                                                        </telerik:GridBoundColumn>
                                                         <telerik:GridBoundColumn DataField="Status" 
                                                            FilterControlAltText="Filter Status column" HeaderText="Status" 
                                                            SortExpression="Status" UniqueName="Status">
                                                        </telerik:GridBoundColumn>
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
                                    <td class="style8" colspan="4" style="height: 16px; ">
                                        <asp:Panel ID="Panel2" runat="server" Width="1118px">
                                            <table style="width: 99%">
                                                <tr>
                                                    <td>
                                                        <asp:Panel ID="Panel32" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                                                            Height="100%" Width="1109px">
                                                            <table style="width: 99%">
                                                                <tr>
                                                                    <td bgcolor="#666666">
                                                                        <asp:Label ID="Label151" runat="server" Font-Bold="True" Text="Documentation"></asp:Label>
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td>
                                                                        <asp:Panel ID="Panel33" runat="server" Height="100%" ScrollBars="Both" 
                                                                            Width="1100px">
                                                                            <telerik:RadGrid ID="GD_DOCS" runat="server" AllowPaging="True" CellSpacing="0" 
                                                                                GridLines="None" Height="100%" Skin="Sunset" Width="100%">
                                                                                <MasterTableView AutoGenerateColumns="False">
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
                                                                                        <telerik:GridBoundColumn DataField="Ref_No" 
                                                                                            FilterControlAltText="Filter Ref_No column" HeaderText="Ref_No" 
                                                                                            SortExpression="Ref_No" UniqueName="Ref_No">
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
                                                                                        <telerik:GridBoundColumn DataField="Upload_By" 
                                                                                            FilterControlAltText="Filter Upload_By column" HeaderText="Upload_By" 
                                                                                            SortExpression="Upload_By" UniqueName="Upload_By">
                                                                                        </telerik:GridBoundColumn>
                                                                                          <telerik:GridBoundColumn DataField="LICENCE_NO" 
                                                                                            FilterControlAltText="Filter LICENCE_NO column" HeaderText="Licence_No" 
                                                                                            SortExpression="LICENCE_NO" UniqueName="LICENCE_NO">
                                                                                        </telerik:GridBoundColumn>
                                                                                        <telerik:GridTemplateColumn AllowFiltering="false" HeaderText="View" 
                                                                                            SortExpression="DOC_ID">
                                                                                            <ItemTemplate>
                                                                                                <asp:LinkButton ID="lnkDownload" runat="server" 
                                                                                                    CommandArgument='<%# Eval("DOC_ID") %>' OnClick="DownloadFile" Text="Download"></asp:LinkButton>
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
                                                                            ScrollBars="Horizontal" Width="1100px">
                                                                            <asp:Literal ID="ltEmbed" runat="server" />
                                                                        </asp:Panel>
                                                                    </td>
                                                                </tr>
                                                            </table>
                                                        </asp:Panel>
                                                    </td>
                                                </tr>
                                            </table>
                                        </asp:Panel>
                                    </td>
                                </tr>
                            </table>
                        </asp:Panel>
                    </td>
                    <td>
                        &nbsp;</td>
                </tr>
                <tr>
                    <td>
                        <asp:Panel ID="Panel35" runat="server" BorderColor="#000001" 
                            BorderStyle="Solid" BorderWidth="1px" Width="1120px">
                            <table style="width: 100%">
                                <tr>
                                    <td>
                                        <asp:Panel ID="Panel15" runat="server" Height="100%" ScrollBars="Both" 
                                            Width="98%">
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
                                                        <telerik:GridBoundColumn DataField="Ref_No" 
                                                            FilterControlAltText="Filter Ref_No column" HeaderText="Ref_No" 
                                                            ItemStyle-Width="50" SortExpression="Ref_No" UniqueName="Ref_No">
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
                    <td>
                        &nbsp;</td>
                </tr>
            </table>
        </ContentTemplate>
          <Triggers>
        <asp:PostBackTrigger ControlID = "btnupload" />
          </Triggers>
    </asp:UpdatePanel>
</asp:Content>


