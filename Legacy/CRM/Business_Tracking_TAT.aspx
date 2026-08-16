<%@ Page Title="" Language="VB" MasterPageFile="~/MasterPage.master"  AutoEventWireup="false" CodeFile="Business_Tracking_TAT.aspx.vb" Inherits="_Default" %>

<%@ OutputCache Location="None" %>
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
                        Width="1216px">
                 
                 <table style="width: 96%; margin-left: 0px;" align="center">
                                <tr>
                                    <td class="style8">
                                      <asp:Panel ID="Panel8" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                            Height="100%" Width="1193px">
                            <table style="1100: ;">
                                <tr>
                                    <td align="center" bgcolor="#CCCCCC">
                                        <asp:Label ID="Label135" runat="server" Font-Bold="True" 
                                            Text="BUSINESS UPDATE TAT" Font-Size="Medium"></asp:Label>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        <table style="width: 1186px">
                                            <tr>
                                                <td align="right">
                                                    <asp:Panel ID="Panel34" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                                                        Height="100%" Width="1177px">
                                                        <table style="width: 100%">
                                                            <tr>
                                                                <td align="right" style="width: 624px">
                                                                    &nbsp;</td>
                                                                <td style="width: 123px">
                                                                    <asp:Label ID="Label177" runat="server" style="font-weight: 700" 
                                                                        Text="Date From"></asp:Label>
                                                                </td>
                                                                <td style="width: 186px">
                                                                    <telerik:RadDatePicker ID="Dtfrom" Runat="server" Skin="Simple">
                                                                        <Calendar Skin="Simple" UseColumnHeadersAsSelectors="False" 
                                                                            UseRowHeadersAsSelectors="False" ViewSelectorText="x">
                                                                        </Calendar>
                                                                        <DateInput DateFormat="dd-MMM-yyyy" DisplayDateFormat="dd-MMM-yyyy">
                                                                        </DateInput>
                                                                        <DatePopupButton HoverImageUrl="" ImageUrl="" />
                                                                    </telerik:RadDatePicker>
                                                                </td>
                                                                <td>
                                                                    &nbsp;</td>
                                                            </tr>
                                                            <tr>
                                                                <td style="width: 624px">
                                                                    &nbsp;</td>
                                                                <td style="width: 123px">
                                                                    <asp:Label ID="Label178" runat="server" style="font-weight: 700" Text="Date To"></asp:Label>
                                                                </td>
                                                                <td style="width: 186px">
                                                                    <telerik:RadDatePicker ID="Dtto" Runat="server" Skin="Simple">
                                                                        <Calendar Skin="Simple" UseColumnHeadersAsSelectors="False" 
                                                                            UseRowHeadersAsSelectors="False" ViewSelectorText="x">
                                                                        </Calendar>
                                                                        <DateInput DateFormat="dd-MMM-yyyy" DisplayDateFormat="dd-MMM-yyyy">
                                                                        </DateInput>
                                                                        <DatePopupButton HoverImageUrl="" ImageUrl="" />
                                                                    </telerik:RadDatePicker>
                                                                </td>
                                                                <td>
                                                                    &nbsp;</td>
                                                            </tr>
                                                            <tr>
                                                                <td style="width: 624px">
                                                                    &nbsp;</td>
                                                                <td style="width: 123px">
                                                                    <asp:Label ID="Label180" runat="server" style="font-weight: 700" 
                                                                        Text="Business Type"></asp:Label>
                                                                </td>
                                                                <td>
                                                                    <telerik:RadComboBox ID="cbotype" Runat="server" Skin="Simple">
                                                                        <Items>
                                                                            <telerik:RadComboBoxItem runat="server" />
                                                                            <telerik:RadComboBoxItem runat="server" Text="New" Value="New" />
                                                                            <telerik:RadComboBoxItem runat="server" Text="Renewal" Value="Renewal" />
                                                                            <telerik:RadComboBoxItem runat="server" Text="Addons" Value="Addons" />
                                                                        </Items>
                                                                    </telerik:RadComboBox>
                                                                </td>
                                                                <td>
                                                                    &nbsp;</td>
                                                            </tr>
                                                            <tr>
                                                                <td style="width: 624px">
                                                                    &nbsp;</td>
                                                                <td style="width: 123px">
                                                                    <asp:Label ID="Label179" runat="server" style="font-weight: 700" Text="File No"></asp:Label>
                                                                </td>
                                                                <td>
                                                                    <telerik:RadTextBox ID="TXT_N" Runat="server" Skin="Outlook" Width="150px">
                                                                    </telerik:RadTextBox>
                                                                </td>
                                                                <td>
                                                                    <telerik:RadButton ID="cmdview0" runat="server" Skin="Simple" Text="View" 
                                                                        Width="157px">
                                                                    </telerik:RadButton>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </asp:Panel>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <asp:Panel ID="Panel32" runat="server" Height="100%" ScrollBars="Both" 
                                                        Width="1177px">
                                                        <telerik:RadGrid ID="GD_SUMM_1" runat="server" AllowPaging="True" CellSpacing="0" 
                                                            GridLines="None" Height="100%" PageSize="20" Skin="Web20" Width="100%">
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
                                                                    <telerik:GridBoundColumn DataField="File_no" 
                                                                        FilterControlAltText="Filter File_No column" HeaderText="File_No" 
                                                                        SortExpression="File_No" UniqueName="File_No">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="BUSINESS_TYPE" 
                                                                        FilterControlAltText="Filter BUSINESS_TYPE column" HeaderText="BUSINESS_TYPE" 
                                                                        SortExpression="BUSINESS_TYPE" UniqueName="BUSINESS_TYPE">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="REGISTRATION" 
                                                                        FilterControlAltText="Filter REGISTRATION column" HeaderText="REGISTRATION" 
                                                                        SortExpression="REGISTRATION" UniqueName="REGISTRATION">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="TO_MED_UW" 
                                                                        FilterControlAltText="Filter TO_MED_UW column" HeaderText="TO_MED_UW" 
                                                                        SortExpression="TO_MED_UW" UniqueName="TO_MED_UW">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="MED_UW" 
                                                                        FilterControlAltText="Filter MED_UW column" HeaderText="MED_UW" 
                                                                        SortExpression="MED_UW" UniqueName="MED_UW">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="PRICING" 
                                                                        FilterControlAltText="Filter PRICING column" HeaderText="PRICING" 
                                                                        SortExpression="PRICING" UniqueName="PRICING">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="MSHIP_ALLOCATE" 
                                                                        FilterControlAltText="Filter MSHIP_ALLOCATE column" HeaderText="MSHIP_ALLOCATE" 
                                                                        SortExpression="MSHIP_ALLOCATE" UniqueName="MSHIP_ALLOCATE">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="UPDATE_TAT" 
                                                                        FilterControlAltText="Filter UPDATE_TAT column" HeaderText="UPDATE_TAT" 
                                                                        SortExpression="UPDATE_TAT" UniqueName="UPDATE_TAT">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="RECEIPT" 
                                                                        FilterControlAltText="Filter RECEIPT column" HeaderText="RECEIPT" 
                                                                        SortExpression="RECEIPT" UniqueName="RECEIPT">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="TOTAL_TAT" 
                                                                        FilterControlAltText="Filter TOTAL_TAT column" HeaderText="TOTAL_TAT" 
                                                                        SortExpression="TOTAL_TAT" UniqueName="TOTAL_TAT">
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
                                                    <telerik:RadTabStrip ID="RadTabStrip1" runat="server" 
                                                        MultiPageID="RadMultiPage1" Skin="Web20" SelectedIndex="0">
                                                        <Tabs>
                                                            <telerik:RadTab runat="server" Owner="RadTabStrip1" PageViewID="V1" 
                                                                Text="Registration" Selected="True">
                                                            </telerik:RadTab>
                                                            <telerik:RadTab runat="server" Owner="RadTabStrip1" PageViewID="V2" 
                                                                Text="To_Med_UW">
                                                            </telerik:RadTab>
                                                            <telerik:RadTab runat="server" Owner="RadTabStrip1" PageViewID="V3" 
                                                                Text="Med_UW">
                                                            </telerik:RadTab>
                                                            <telerik:RadTab runat="server" Owner="RadTabStrip1" PageViewID="V4" 
                                                                Text="Pricing">
                                                            </telerik:RadTab>
                                                            <telerik:RadTab runat="server" Owner="RadTabStrip1" PageViewID="V5" 
                                                                Text="Mship Allocate">
                                                            </telerik:RadTab>
                                                            <telerik:RadTab runat="server" Owner="RadTabStrip1" PageViewID="V6" 
                                                                Text="Mship Update">
                                                            </telerik:RadTab>
                                                            <telerik:RadTab runat="server" PageViewID="V7" Text="Receipt">
                                                            </telerik:RadTab>
                                                        </Tabs>
                                                    </telerik:RadTabStrip>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <telerik:RadMultiPage ID="RadMultiPage1" Runat="server" Width="100%">
                                                        <telerik:RadPageView ID="V1" runat="server" Selected="True">
                                                            <asp:Panel ID="Panel35" runat="server">
                                                                <asp:Panel ID="Panel36" runat="server" Height="100%" ScrollBars="Both" 
                                                                    Width="1177px">
                                                                    <telerik:RadGrid ID="GD_SUMM_3" runat="server" AllowPaging="True" 
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
                                                                                
                                                                                <telerik:GridBoundColumn DataField="File_no" 
                                                                                    FilterControlAltText="Filter File_No column" HeaderText="File_No" 
                                                                                    SortExpression="File_No" UniqueName="File_No">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="BUSINESS_TYPE" 
                                                                                    FilterControlAltText="Filter BUSINESS_TYPE column" HeaderText="BUSINESS_TYPE" 
                                                                                    SortExpression="BUSINESS_TYPE" UniqueName="BUSINESS_TYPE">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="REGISTRATION" 
                                                                                    FilterControlAltText="Filter REGISTRATION column" HeaderText="REGISTRATION" 
                                                                                    SortExpression="REGISTRATION" UniqueName="REGISTRATION">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="TO_MED_UW" 
                                                                                    FilterControlAltText="Filter TO_MED_UW column" HeaderText="TO_MED_UW" 
                                                                                    SortExpression="TO_MED_UW" UniqueName="TO_MED_UW">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="MED_UW" 
                                                                                    FilterControlAltText="Filter MED_UW column" HeaderText="MED_UW" 
                                                                                    SortExpression="MED_UW" UniqueName="MED_UW">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="PRICING" 
                                                                                    FilterControlAltText="Filter PRICING column" HeaderText="PRICING" 
                                                                                    SortExpression="PRICING" UniqueName="PRICING">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="MSHIP_ALLOCATE" 
                                                                                    FilterControlAltText="Filter MSHIP_ALLOCATE column" HeaderText="MSHIP_ALLOCATE" 
                                                                                    SortExpression="MSHIP_ALLOCATE" UniqueName="MSHIP_ALLOCATE">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="UPDATE_TAT" 
                                                                                    FilterControlAltText="Filter UPDATE_TAT column" HeaderText="UPDATE_TAT" 
                                                                                    SortExpression="UPDATE_TAT" UniqueName="UPDATE_TAT">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="RECEIPT" 
                                                                                    FilterControlAltText="Filter RECEIPT column" HeaderText="RECEIPT" 
                                                                                    SortExpression="RECEIPT" UniqueName="RECEIPT">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="TOTAL_TAT" 
                                                                                    FilterControlAltText="Filter TOTAL_TAT column" HeaderText="TOTAL_TAT" 
                                                                                    SortExpression="TOTAL_TAT" UniqueName="TOTAL_TAT">
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
                                                            </asp:Panel>
                                                        </telerik:RadPageView>
                                                         <telerik:RadPageView ID="V2" runat="server">
                                                            <asp:Panel ID="Panel2" runat="server">
                                                                <asp:Panel ID="Panel3" runat="server" Height="100%" ScrollBars="Both" 
                                                                    Width="1177px">
                                                                    <telerik:RadGrid ID="GD_SUMM_4" runat="server" AllowPaging="True" 
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
                                                                               
                                                                                <telerik:GridBoundColumn DataField="File_no" 
                                                                                    FilterControlAltText="Filter File_No column" HeaderText="File_No" 
                                                                                    SortExpression="File_No" UniqueName="File_No">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="BUSINESS_TYPE" 
                                                                                    FilterControlAltText="Filter BUSINESS_TYPE column" HeaderText="BUSINESS_TYPE" 
                                                                                    SortExpression="BUSINESS_TYPE" UniqueName="BUSINESS_TYPE">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="REGISTRATION" 
                                                                                    FilterControlAltText="Filter REGISTRATION column" HeaderText="REGISTRATION" 
                                                                                    SortExpression="REGISTRATION" UniqueName="REGISTRATION">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="TO_MED_UW" 
                                                                                    FilterControlAltText="Filter TO_MED_UW column" HeaderText="TO_MED_UW" 
                                                                                    SortExpression="TO_MED_UW" UniqueName="TO_MED_UW">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="MED_UW" 
                                                                                    FilterControlAltText="Filter MED_UW column" HeaderText="MED_UW" 
                                                                                    SortExpression="MED_UW" UniqueName="MED_UW">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="PRICING" 
                                                                                    FilterControlAltText="Filter PRICING column" HeaderText="PRICING" 
                                                                                    SortExpression="PRICING" UniqueName="PRICING">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="MSHIP_ALLOCATE" 
                                                                                    FilterControlAltText="Filter MSHIP_ALLOCATE column" HeaderText="MSHIP_ALLOCATE" 
                                                                                    SortExpression="MSHIP_ALLOCATE" UniqueName="MSHIP_ALLOCATE">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="UPDATE_TAT" 
                                                                                    FilterControlAltText="Filter UPDATE_TAT column" HeaderText="UPDATE_TAT" 
                                                                                    SortExpression="UPDATE_TAT" UniqueName="UPDATE_TAT">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="RECEIPT" 
                                                                                    FilterControlAltText="Filter RECEIPT column" HeaderText="RECEIPT" 
                                                                                    SortExpression="RECEIPT" UniqueName="RECEIPT">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="TOTAL_TAT" 
                                                                                    FilterControlAltText="Filter TOTAL_TAT column" HeaderText="TOTAL_TAT" 
                                                                                    SortExpression="TOTAL_TAT" UniqueName="TOTAL_TAT">
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
                                                            </asp:Panel>
                                                        </telerik:RadPageView>
                                                         <telerik:RadPageView ID="V3" runat="server">
                                                            <asp:Panel ID="Panel4" runat="server">
                                                                <asp:Panel ID="Panel5" runat="server" Height="100%" ScrollBars="Both" 
                                                                    Width="1177px">
                                                                    <telerik:RadGrid ID="GD_SUMM_5" runat="server" AllowPaging="True" 
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
                                                                            
                                                                                <telerik:GridBoundColumn DataField="File_no" 
                                                                                    FilterControlAltText="Filter File_No column" HeaderText="File_No" 
                                                                                    SortExpression="File_No" UniqueName="File_No">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="BUSINESS_TYPE" 
                                                                                    FilterControlAltText="Filter BUSINESS_TYPE column" HeaderText="BUSINESS_TYPE" 
                                                                                    SortExpression="BUSINESS_TYPE" UniqueName="BUSINESS_TYPE">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="REGISTRATION" 
                                                                                    FilterControlAltText="Filter REGISTRATION column" HeaderText="REGISTRATION" 
                                                                                    SortExpression="REGISTRATION" UniqueName="REGISTRATION">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="TO_MED_UW" 
                                                                                    FilterControlAltText="Filter TO_MED_UW column" HeaderText="TO_MED_UW" 
                                                                                    SortExpression="TO_MED_UW" UniqueName="TO_MED_UW">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="MED_UW" 
                                                                                    FilterControlAltText="Filter MED_UW column" HeaderText="MED_UW" 
                                                                                    SortExpression="MED_UW" UniqueName="MED_UW">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="PRICING" 
                                                                                    FilterControlAltText="Filter PRICING column" HeaderText="PRICING" 
                                                                                    SortExpression="PRICING" UniqueName="PRICING">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="MSHIP_ALLOCATE" 
                                                                                    FilterControlAltText="Filter MSHIP_ALLOCATE column" HeaderText="MSHIP_ALLOCATE" 
                                                                                    SortExpression="MSHIP_ALLOCATE" UniqueName="MSHIP_ALLOCATE">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="UPDATE_TAT" 
                                                                                    FilterControlAltText="Filter UPDATE_TAT column" HeaderText="UPDATE_TAT" 
                                                                                    SortExpression="UPDATE_TAT" UniqueName="UPDATE_TAT">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="RECEIPT" 
                                                                                    FilterControlAltText="Filter RECEIPT column" HeaderText="RECEIPT" 
                                                                                    SortExpression="RECEIPT" UniqueName="RECEIPT">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="TOTAL_TAT" 
                                                                                    FilterControlAltText="Filter TOTAL_TAT column" HeaderText="TOTAL_TAT" 
                                                                                    SortExpression="TOTAL_TAT" UniqueName="TOTAL_TAT">
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
                                                            </asp:Panel>
                                                        </telerik:RadPageView>
                                                         <telerik:RadPageView ID="V4" runat="server">
                                                            <asp:Panel ID="Panel6" runat="server">
                                                                <asp:Panel ID="Panel7" runat="server" Height="100%" ScrollBars="Both" 
                                                                    Width="1177px">
                                                                    <telerik:RadGrid ID="GD_SUMM_6" runat="server" AllowPaging="True" 
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
                                                                             
                                                                                <telerik:GridBoundColumn DataField="File_no" 
                                                                                    FilterControlAltText="Filter File_No column" HeaderText="File_No" 
                                                                                    SortExpression="File_No" UniqueName="File_No">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="BUSINESS_TYPE" 
                                                                                    FilterControlAltText="Filter BUSINESS_TYPE column" HeaderText="BUSINESS_TYPE" 
                                                                                    SortExpression="BUSINESS_TYPE" UniqueName="BUSINESS_TYPE">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="REGISTRATION" 
                                                                                    FilterControlAltText="Filter REGISTRATION column" HeaderText="REGISTRATION" 
                                                                                    SortExpression="REGISTRATION" UniqueName="REGISTRATION">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="TO_MED_UW" 
                                                                                    FilterControlAltText="Filter TO_MED_UW column" HeaderText="TO_MED_UW" 
                                                                                    SortExpression="TO_MED_UW" UniqueName="TO_MED_UW">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="MED_UW" 
                                                                                    FilterControlAltText="Filter MED_UW column" HeaderText="MED_UW" 
                                                                                    SortExpression="MED_UW" UniqueName="MED_UW">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="PRICING" 
                                                                                    FilterControlAltText="Filter PRICING column" HeaderText="PRICING" 
                                                                                    SortExpression="PRICING" UniqueName="PRICING">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="MSHIP_ALLOCATE" 
                                                                                    FilterControlAltText="Filter MSHIP_ALLOCATE column" HeaderText="MSHIP_ALLOCATE" 
                                                                                    SortExpression="MSHIP_ALLOCATE" UniqueName="MSHIP_ALLOCATE">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="UPDATE_TAT" 
                                                                                    FilterControlAltText="Filter UPDATE_TAT column" HeaderText="UPDATE_TAT" 
                                                                                    SortExpression="UPDATE_TAT" UniqueName="UPDATE_TAT">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="RECEIPT" 
                                                                                    FilterControlAltText="Filter RECEIPT column" HeaderText="RECEIPT" 
                                                                                    SortExpression="RECEIPT" UniqueName="RECEIPT">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="TOTAL_TAT" 
                                                                                    FilterControlAltText="Filter TOTAL_TAT column" HeaderText="TOTAL_TAT" 
                                                                                    SortExpression="TOTAL_TAT" UniqueName="TOTAL_TAT">
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
                                                            </asp:Panel>
                                                        </telerik:RadPageView>
                                                         <telerik:RadPageView ID="V5" runat="server">
                                                            <asp:Panel ID="Panel9" runat="server">
                                                                <asp:Panel ID="Panel10" runat="server" Height="100%" ScrollBars="Both" 
                                                                    Width="1177px">
                                                                    <telerik:RadGrid ID="GD_SUMM_7" runat="server" AllowPaging="True" 
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
                                                                             
                                                                                <telerik:GridBoundColumn DataField="File_no" 
                                                                                    FilterControlAltText="Filter File_No column" HeaderText="File_No" 
                                                                                    SortExpression="File_No" UniqueName="File_No">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="BUSINESS_TYPE" 
                                                                                    FilterControlAltText="Filter BUSINESS_TYPE column" HeaderText="BUSINESS_TYPE" 
                                                                                    SortExpression="BUSINESS_TYPE" UniqueName="BUSINESS_TYPE">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="REGISTRATION" 
                                                                                    FilterControlAltText="Filter REGISTRATION column" HeaderText="REGISTRATION" 
                                                                                    SortExpression="REGISTRATION" UniqueName="REGISTRATION">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="TO_MED_UW" 
                                                                                    FilterControlAltText="Filter TO_MED_UW column" HeaderText="TO_MED_UW" 
                                                                                    SortExpression="TO_MED_UW" UniqueName="TO_MED_UW">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="MED_UW" 
                                                                                    FilterControlAltText="Filter MED_UW column" HeaderText="MED_UW" 
                                                                                    SortExpression="MED_UW" UniqueName="MED_UW">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="PRICING" 
                                                                                    FilterControlAltText="Filter PRICING column" HeaderText="PRICING" 
                                                                                    SortExpression="PRICING" UniqueName="PRICING">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="MSHIP_ALLOCATE" 
                                                                                    FilterControlAltText="Filter MSHIP_ALLOCATE column" HeaderText="MSHIP_ALLOCATE" 
                                                                                    SortExpression="MSHIP_ALLOCATE" UniqueName="MSHIP_ALLOCATE">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="UPDATE_TAT" 
                                                                                    FilterControlAltText="Filter UPDATE_TAT column" HeaderText="UPDATE_TAT" 
                                                                                    SortExpression="UPDATE_TAT" UniqueName="UPDATE_TAT">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="RECEIPT" 
                                                                                    FilterControlAltText="Filter RECEIPT column" HeaderText="RECEIPT" 
                                                                                    SortExpression="RECEIPT" UniqueName="RECEIPT">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="TOTAL_TAT" 
                                                                                    FilterControlAltText="Filter TOTAL_TAT column" HeaderText="TOTAL_TAT" 
                                                                                    SortExpression="TOTAL_TAT" UniqueName="TOTAL_TAT">
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
                                                            </asp:Panel>
                                                        </telerik:RadPageView>
                                                         <telerik:RadPageView ID="V6" runat="server">
                                                            <asp:Panel ID="Panel11" runat="server">
                                                                <asp:Panel ID="Panel12" runat="server" Height="100%" ScrollBars="Both" 
                                                                    Width="1177px">
                                                                    <telerik:RadGrid ID="GD_SUMM_8" runat="server" AllowPaging="True" 
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
                                                                               
                                                                                <telerik:GridBoundColumn DataField="File_no" 
                                                                                    FilterControlAltText="Filter File_No column" HeaderText="File_No" 
                                                                                    SortExpression="File_No" UniqueName="File_No">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="BUSINESS_TYPE" 
                                                                                    FilterControlAltText="Filter BUSINESS_TYPE column" HeaderText="BUSINESS_TYPE" 
                                                                                    SortExpression="BUSINESS_TYPE" UniqueName="BUSINESS_TYPE">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="REGISTRATION" 
                                                                                    FilterControlAltText="Filter REGISTRATION column" HeaderText="REGISTRATION" 
                                                                                    SortExpression="REGISTRATION" UniqueName="REGISTRATION">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="TO_MED_UW" 
                                                                                    FilterControlAltText="Filter TO_MED_UW column" HeaderText="TO_MED_UW" 
                                                                                    SortExpression="TO_MED_UW" UniqueName="TO_MED_UW">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="MED_UW" 
                                                                                    FilterControlAltText="Filter MED_UW column" HeaderText="MED_UW" 
                                                                                    SortExpression="MED_UW" UniqueName="MED_UW">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="PRICING" 
                                                                                    FilterControlAltText="Filter PRICING column" HeaderText="PRICING" 
                                                                                    SortExpression="PRICING" UniqueName="PRICING">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="MSHIP_ALLOCATE" 
                                                                                    FilterControlAltText="Filter MSHIP_ALLOCATE column" HeaderText="MSHIP_ALLOCATE" 
                                                                                    SortExpression="MSHIP_ALLOCATE" UniqueName="MSHIP_ALLOCATE">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="UPDATE_TAT" 
                                                                                    FilterControlAltText="Filter UPDATE_TAT column" HeaderText="UPDATE_TAT" 
                                                                                    SortExpression="UPDATE_TAT" UniqueName="UPDATE_TAT">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="RECEIPT" 
                                                                                    FilterControlAltText="Filter RECEIPT column" HeaderText="RECEIPT" 
                                                                                    SortExpression="RECEIPT" UniqueName="RECEIPT">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="TOTAL_TAT" 
                                                                                    FilterControlAltText="Filter TOTAL_TAT column" HeaderText="TOTAL_TAT" 
                                                                                    SortExpression="TOTAL_TAT" UniqueName="TOTAL_TAT">
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
                                                            </asp:Panel>
                                                        </telerik:RadPageView>
                                                          <telerik:RadPageView ID="V7" runat="server">
                                                            <asp:Panel ID="Panel13" runat="server">
                                                                <asp:Panel ID="Panel14" runat="server" Height="100%" ScrollBars="Both" 
                                                                    Width="1177px">
                                                                    <telerik:RadGrid ID="GD_SUMM_9" runat="server" AllowPaging="True" 
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
                                                                          
                                                                                <telerik:GridBoundColumn DataField="File_no" 
                                                                                    FilterControlAltText="Filter File_No column" HeaderText="File_No" 
                                                                                    SortExpression="File_No" UniqueName="File_No">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="BUSINESS_TYPE" 
                                                                                    FilterControlAltText="Filter BUSINESS_TYPE column" HeaderText="BUSINESS_TYPE" 
                                                                                    SortExpression="BUSINESS_TYPE" UniqueName="BUSINESS_TYPE">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="REGISTRATION" 
                                                                                    FilterControlAltText="Filter REGISTRATION column" HeaderText="REGISTRATION" 
                                                                                    SortExpression="REGISTRATION" UniqueName="REGISTRATION">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="TO_MED_UW" 
                                                                                    FilterControlAltText="Filter TO_MED_UW column" HeaderText="TO_MED_UW" 
                                                                                    SortExpression="TO_MED_UW" UniqueName="TO_MED_UW">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="MED_UW" 
                                                                                    FilterControlAltText="Filter MED_UW column" HeaderText="MED_UW" 
                                                                                    SortExpression="MED_UW" UniqueName="MED_UW">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="PRICING" 
                                                                                    FilterControlAltText="Filter PRICING column" HeaderText="PRICING" 
                                                                                    SortExpression="PRICING" UniqueName="PRICING">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="MSHIP_ALLOCATE" 
                                                                                    FilterControlAltText="Filter MSHIP_ALLOCATE column" HeaderText="MSHIP_ALLOCATE" 
                                                                                    SortExpression="MSHIP_ALLOCATE" UniqueName="MSHIP_ALLOCATE">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="UPDATE_TAT" 
                                                                                    FilterControlAltText="Filter UPDATE_TAT column" HeaderText="UPDATE_TAT" 
                                                                                    SortExpression="UPDATE_TAT" UniqueName="UPDATE_TAT">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="RECEIPT" 
                                                                                    FilterControlAltText="Filter RECEIPT column" HeaderText="RECEIPT" 
                                                                                    SortExpression="RECEIPT" UniqueName="RECEIPT">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="TOTAL_TAT" 
                                                                                    FilterControlAltText="Filter TOTAL_TAT column" HeaderText="TOTAL_TAT" 
                                                                                    SortExpression="TOTAL_TAT" UniqueName="TOTAL_TAT">
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
                                                            </asp:Panel>
                                                        </telerik:RadPageView>
                                                    </telerik:RadMultiPage>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <asp:Panel ID="Panel33" runat="server" Height="100%" ScrollBars="Both" 
                                                        Width="1177px">
                                                        <telerik:RadGrid ID="GD_SUMM_2" runat="server" AllowPaging="True" 
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
                                                                    <telerik:GridBoundColumn DataField="file_no" 
                                                                        FilterControlAltText="Filter File_No column" HeaderText="File_No" 
                                                                        SortExpression="File_No" UniqueName="File_No">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Entry_date" 
                                                                        DataFormatString="{0:yyyy-MM-dd}" 
                                                                        FilterControlAltText="Filter Entry_date column" HeaderText="Entry_date" 
                                                                        SortExpression="Entry_date" UniqueName="Entry_date">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Action_By" 
                                                                        FilterControlAltText="Filter Action_By column" HeaderText="Action_By" 
                                                                        SortExpression="Action_By" UniqueName="Action_By">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Business_type" 
                                                                        FilterControlAltText="Filter Business_type column" HeaderText="Business_type" 
                                                                        SortExpression="Business_type" UniqueName="Business_type">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Entry_Mon" 
                                                                        FilterControlAltText="Filter Entry_Mon column" HeaderText="Entry_Mon" 
                                                                        SortExpression="Entry_Mon" UniqueName="Entry_Mon">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Date_From" 
                                                                        DataFormatString="{0:yyyy-MM-dd}" 
                                                                        FilterControlAltText="Filter Date_From column" HeaderText="Date_From" 
                                                                        SortExpression="Date_From" UniqueName="Date_From">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Date_To" DataFormatString="{0:yyyy-MM-dd}" 
                                                                        FilterControlAltText="Filter Date_To column" HeaderText="Date_To" 
                                                                        SortExpression="Date_To" UniqueName="Date_To">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Tat" 
                                                                        FilterControlAltText="Filter Tat column" HeaderText="Tat" SortExpression="Tat" 
                                                                        UniqueName="Tat">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="NAME" 
                                                                        FilterControlAltText="Filter NAME column" HeaderText="Name" 
                                                                        SortExpression="NAME" UniqueName="NAME">
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
                                    <td style="height: 41px">
                                        &nbsp;<asp:Label ID="lblerr" runat="server" Font-Bold="True" Font-Size="Medium" 
                                            ForeColor="Red"></asp:Label>
                                        <asp:HiddenField ID="HiddenField1" runat="server" />
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <asp:Panel ID="Panel15" runat="server" Height="100%" ScrollBars="Both" 
                                            Width="100%">
                                            <telerik:RadGrid ID="GDNOTES" runat="server" AllowPaging="True" CellSpacing="0" 
                                                GridLines="None" Height="100%" Skin="WebBlue" Width="100%">
                                                <MasterTableView AutoGenerateColumns="False">
                                                    <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                    <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                    </RowIndicatorColumn>
                                                    <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                    </ExpandCollapseColumn>
                                                    <Columns>
                                                        <telerik:GridBoundColumn DataField="Note_date" 
                                                         DataFormatString="{0:yyyy-MM-dd}" 
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
       
            </asp:UpdatePanel>
</asp:Content>

